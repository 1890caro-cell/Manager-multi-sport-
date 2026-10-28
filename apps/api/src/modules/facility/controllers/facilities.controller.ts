import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../auth/index.js';
import { ResourceService } from '../services/resource.service.js';
import { OperatingHoursService } from '../services/operating-hours.service.js';
import { PricingService } from '../services/pricing.service.js';
import { calculatePriceSchema } from '@sports/contracts';

@Controller(['facility', 'facilities'])
export class FacilitiesController {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly operatingHoursService: OperatingHoursService,
    private readonly pricingService: PricingService,
  ) {}

  @Public()
  @Get('resources')
  async getResources(
    @Query('kind') kind?: string,
    @Query('sport') sport?: string,
    @Query('status') status?: string,
  ) {
    const list = await this.resourceService.findAll({ kind, sport, status });
    return { data: list };
  }

  @Public()
  @Get('resources/:id')
  async getResourceById(@Param('id') id: string) {
    const resource = await this.resourceService.findById(id);
    return { data: resource };
  }

  @Public()
  @Get('operating-hours')
  async getOperatingHours() {
    const doc = await this.operatingHoursService.getOperatingHours();
    return { data: doc };
  }

  @Public()
  @Get('pricing')
  async getPricing(@Query('appliesTo') appliesTo?: string) {
    const rules = await this.pricingService.findAll({ appliesTo, isActive: true });
    return { data: rules };
  }

  @Public()
  @Post('pricing/calculate')
  @HttpCode(HttpStatus.OK)
  async calculatePrice(@Body() body: any) {
    let resourceCode = body.resourceCode;
    if (!resourceCode && body.resourceId) {
      try {
        const res = await this.resourceService.findById(body.resourceId);
        resourceCode = res.code;
      } catch {}
    }
    const validated = calculatePriceSchema.parse({
      ...body,
      resourceCode,
    });
    const result = await this.pricingService.calculatePrice(validated);
    return { data: result };
  }
}

@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly resourceService: ResourceService,
  ) {}

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async calculatePrice(@Body() body: any) {
    let resourceCode = body.resourceCode;
    if (!resourceCode && body.resourceId) {
      try {
        const res = await this.resourceService.findById(body.resourceId);
        resourceCode = res.code;
      } catch {}
    }
    const validated = calculatePriceSchema.parse({
      ...body,
      resourceCode,
    });
    const result = await this.pricingService.calculatePrice(validated);
    return { data: result };
  }
}
