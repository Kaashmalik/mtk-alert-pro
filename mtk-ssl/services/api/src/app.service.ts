import { Injectable } from "@nestjs/common";

/**
 * Root application service
 */
@Injectable()
export class AppService {
  getHello(): string {
    return "Shakir Super League API - Built by Malik Tech";
  }
}

