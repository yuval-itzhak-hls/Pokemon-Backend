import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Pokemon, PokemonSchema } from '../pokemons/schemas/pokemon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Pokemon.name, schema: PokemonSchema },
    ]),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [
    MongooseModule, 
  ],
})
export class UsersModule {}
