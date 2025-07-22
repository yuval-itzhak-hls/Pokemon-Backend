// src/pokemons/pokemons.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon, PokemonDocument } from './schemas/pokemon.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { UsersModule } from '../users/users.module';

type FilterOptions = {
  mine?: string;
  current?: string;
  search?: string;
  sortBy?: string;
  order?: string;
}

@Injectable()
export class PokemonsService {
  constructor(
    @InjectModel(Pokemon.name) private pokemonModel: Model<PokemonDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

   async findWithFilters(email: string, filters: {
    mine?: string;
    current?: string;
    search?: string;
    sortBy?: string;
    order?: string;
    }): Promise<Pokemon[]> {
        
        const user = await this.userModel
            .findOne({ email })
            .populate('caughtPokemons')
            .lean();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const allPokemonDocs = await this.pokemonModel.find().lean();

        let pokemons: Pokemon[];

        if (filters.mine === 'true') {
            const myIds = user.caughtPokemons.map(p => p.toString());
            pokemons = allPokemonDocs.filter(p => myIds.includes(p._id.toString()));
        } else if (filters.mine === 'false') {
            const myIds = user.caughtPokemons.map(p => p.toString());
            pokemons = allPokemonDocs.filter(p => !myIds.includes(p._id.toString()));
        } else {
            pokemons = allPokemonDocs;
        }

        if (filters.current) {
            pokemons = pokemons.filter(p => p.id !== filters.current);
        }

        if (filters.search) {
            const regex = new RegExp(filters.search, 'i');
            pokemons = pokemons.filter(p =>
            regex.test(p.name),
            );
        }

        if (filters.sortBy) {
            const sortKey = filters.sortBy as keyof Pokemon;
            const order = filters.order === 'desc' ? -1 : 1;
            pokemons = pokemons.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal) * order;
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return (aVal - bVal) * order;
            }
            return 0;
            });
        }

        
        return pokemons;
    }


    async findOne(id: string): Promise<Pokemon> {
        const pokemon = await this.pokemonModel.findOne({ id }).exec();
        if (!pokemon) {
        throw new NotFoundException(`Pokemon with id ${id} not found`);
        }
        return pokemon;
    }


}
