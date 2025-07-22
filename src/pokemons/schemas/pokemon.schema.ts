// src/pokemons/schemas/pokemon.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PokemonDocument = Pokemon & Document;

@Schema()
export class Pokemon {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  powerLevel: number; // Attack

  @Prop({ required: true })
  hpLevel: number;

  @Prop({ required: true })
  image: string;

  @Prop()
  isMyPokemon: boolean;

  @Prop()
  height: string;

  @Prop()
  weight: string;

  @Prop()
  category: string;

  @Prop({ type: [String] })
  abilities: string[];

  @Prop()
  defensePower: number;

  @Prop()
  spAttack: number;

  @Prop()
  spDefense: number;

  @Prop()
  speed: number;

  @Prop({ type: [String] })
  type: string[];
}

export const PokemonSchema = SchemaFactory.createForClass(Pokemon);
