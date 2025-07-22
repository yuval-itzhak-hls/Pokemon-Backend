// src/pokemons/pokemons.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PokemonsService } from './pokemons.service';
import { PokemonsController } from './pokemons.controller';
import { Pokemon, PokemonSchema } from './schemas/pokemon.schema';
import { UsersModule } from '../users/users.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pokemon.name, schema: PokemonSchema, collection: 'pokemons' },
    ]),
    UsersModule,
  ],
  controllers: [PokemonsController],
  providers: [PokemonsService],
})
export class PokemonsModule {}
