import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
  DefaultValuePipe, 
  ParseIntPipe,    
} from '@nestjs/common';
import { Request } from 'express';
import { Pokemon } from './schemas/pokemon.schema';
import { PokemonsService, PaginatedPokemons } from './pokemons.service'; 
import { CognitoGuard } from 'src/users/guard/cognito.guard';

@Controller('pokemons')
@UseGuards(CognitoGuard)
export class PokemonsController {
  constructor(private readonly pokemonsService: PokemonsService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('mine') mine?: string,
    @Query('current') current?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10, 
  ): Promise<PaginatedPokemons> { 
    const email = (req as any).user?.email;

    return this.pokemonsService.findWithFilters(email, {
      mine,
      current,
      search,
      sortBy,
      order,
      page,   
      limit, 
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Pokemon> { 
    return this.pokemonsService.findOne(id);
  }
}