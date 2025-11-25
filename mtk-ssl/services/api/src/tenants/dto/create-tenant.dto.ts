import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

/**
 * DTO for creating a new tenant/league
 */
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  subdomain?: string;

  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsBoolean()
  @IsOptional()
  isWhiteLabel?: boolean;

  @IsString()
  @IsNotEmpty()
  ownerId: string; // Clerk user ID
}

