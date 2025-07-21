import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { User } from './schemas/user.schema';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private cognitoClient: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;
  private userPoolId: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({ region: this.configService.get('AWS_REGION') });
    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>('COGNITO_CLIENT_SECRET')!;
    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID')!;
  }

  private generateSecretHash(username: string): string {
    return crypto
      .createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  async signup(signupDto: SignupDto) {
    const { email, password } = signupDto;

    const secretHash = this.generateSecretHash(email);

    try {
      await this.cognitoClient.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: email,
          Password: password,
          SecretHash: secretHash,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'password', Value: password },
          ],
        }),
      );

      const user = new this.userModel({ email, password });
      await user.save();

      return { message: 'User signed up successfully' };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to sign up');
    }
  }

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;
    const secretHash = this.generateSecretHash(email);

    try {
      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      const response = await this.cognitoClient.send(authCommand);
      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
