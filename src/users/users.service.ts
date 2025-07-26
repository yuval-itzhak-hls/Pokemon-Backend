import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Pokemon, PokemonDocument } from '../pokemons/schemas/pokemon.schema';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ConfirmSignUpCommand,  AuthenticationResultType, SignUpCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminInitiateAuthCommand,
  GlobalSignOutCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Pokemon.name) private pokemonModel: Model<PokemonDocument>,
    private configService: ConfigService,
  ) {
    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID')!;
    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>('COGNITO_CLIENT_SECRET')!;
    const region = this.configService.get<string>('COGNITO_REGION');
    this.cognitoClient = new CognitoIdentityProviderClient({ region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
     });
  }

  private generateSecretHash(username: string): string {
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }


  async signup(signupDto: SignupDto): Promise<SignUpCommandOutput> {
    console.log('Signup DTO:', signupDto);
    const { email, password } = signupDto;
    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = await this.userModel.findOne({ email }).populate('caughtPokemons');
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const createdUser = new this.userModel({
      email,
      password: passwordHash,
      caughtPokemons: [],
    });
    await createdUser.save();

    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
      SecretHash: this.generateSecretHash(email),
      UserAttributes: [
        { Name: 'email', Value: email },
      ],
    });

    try {
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error: any) {
      await this.userModel.deleteOne({ email });

      if (error.name === 'UsernameExistsException') {
        throw new ConflictException('User already exists');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('Password does not meet requirements');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException('Invalid signup parameters');
      }

      throw new BadRequestException(error.message);
    }
  }

  async signin(signinDto: SigninDto): Promise<AuthenticationResultType> {
    const { email, password } = signinDto;

    const command = new AdminInitiateAuthCommand({
      UserPoolId: this.userPoolId,
      ClientId: this.clientId,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.generateSecretHash(email),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }
      return response.AuthenticationResult;
    } catch (error) {
      throw error;
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: this.clientId,
    Username: email,
    ConfirmationCode: code,
    SecretHash: this.generateSecretHash(email),
  });

  try {
    await this.cognitoClient.send(command);

    const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new Error('User not found in MongoDB');
      }

      // add 5 random pokemons
    const randomPokemons = await this.pokemonModel.aggregate([{ $sample: { size: 5 } }]);
    user.caughtPokemons.push(...randomPokemons.map(p => p._id));

    // Set isMyPokemon = true for each selected pokemon
    for (const pokemon of randomPokemons) {
      await this.pokemonModel.updateOne(
        { _id: pokemon._id },
        { $set: { isMyPokemon: true } }
      );
    }

    await user.save();

  } catch (error) {
    throw new Error(`Confirmation failed: ${error.message}`);
  }
}

  async signout(authHeader: string): Promise<void> {
    const accessToken = authHeader?.replace(/^Bearer\s/, '');
    if (!accessToken) {
      throw new Error('Access token required');
    }
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      throw new Error(`Signout failed: ${error.message}`);
    }
  }
}
