import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon, PokemonDocument } from './schemas/pokemon.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';


export type PaginatedPokemons = {
  data: Pokemon[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PokemonsService {
  constructor(
    @InjectModel(Pokemon.name) private pokemonModel: Model<PokemonDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findWithFilters(
    email: string,
    filters: {
      mine?: string;
      current?: string;
      search?: string;
      sortBy?: string;
      order?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedPokemons> {

    const user = await this.userModel.findOne({ email }).lean(); // No need to populate caughtPokemons here yet

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const query: any = {};
    let pokemonIdsToFilter: string[] | null = null; 

    if (filters.mine === 'true') {
      const userWithCaughtPokemons = await this.userModel
        .findOne({ email })
        .populate('caughtPokemons')
        .lean();
      if (userWithCaughtPokemons && userWithCaughtPokemons.caughtPokemons) {

        pokemonIdsToFilter = userWithCaughtPokemons.caughtPokemons.map((p: any) => p._id.toString());
        query._id = { $in: pokemonIdsToFilter };

      } else {
        return {
          data: [],
          totalCount: 0,
          page: filters.page || 1,
          limit: filters.limit || 10,
          totalPages: 0,
        };
      }
    } else if (filters.mine === 'false') {

      const userWithCaughtPokemons = await this.userModel
        .findOne({ email })
        .populate('caughtPokemons')
        .lean();
      if (userWithCaughtPokemons && userWithCaughtPokemons.caughtPokemons) {
        pokemonIdsToFilter = userWithCaughtPokemons.caughtPokemons.map((p: any) => p._id.toString());
        query._id = { $nin: pokemonIdsToFilter };
      }
    }

    if (filters.current) {
      if (query._id) {
        query._id = { ...query._id, $ne: filters.current };
      } else {
        query._id = { $ne: filters.current };
      }
    }

    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.name = { $regex: regex };
    }

    const sortOptions: any = {};
    if (filters.sortBy) {
      sortOptions[filters.sortBy] = filters.order === 'desc' ? -1 : 1;
    }

    const page = filters.page ? parseInt(filters.page.toString(), 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit.toString(), 10) : 10;
    const skip = (page - 1) * limit;

    const totalCount = await this.pokemonModel.countDocuments(query);

    const pokemons = await this.pokemonModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(); // Use .lean() for plain JavaScript objects, better performance

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: pokemons,
      totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Pokemon> {
    const pokemon = await this.pokemonModel.findOne({ id }).exec();
    if (!pokemon) {
      throw new NotFoundException(`Pokemon with id ${id} not found`);
    }
    return pokemon;
  }


  async catchPokemon(email: string, pokemonId: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }


    const pokemon = await this.pokemonModel.findOne({ id: pokemonId });
    if (!pokemon) {
      throw new NotFoundException('Pokemon not found');
    }

    const objectId = pokemon._id as Types.ObjectId;

    if (user.caughtPokemons.includes(objectId)) {
      return;
    }

    user.caughtPokemons.push(objectId);
    pokemon.isMyPokemon = true;
    await user.save();
    await pokemon.save();

  }


}