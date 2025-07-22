import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';

export class PlaceState implements IBotState {
  constructor(private bot: Bot) {
    
}

