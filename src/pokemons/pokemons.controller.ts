// src/pokemons/pokemons.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PokemonsService } from './pokemons.service';
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
  ) {
    const email = (req as any).user?.email;
 
      return this.pokemonsService.findWithFilters(email, {
        mine,
        current,
        search,
        sortBy,
        order,
      });


  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pokemonsService.findOne(id);
  }

}
