import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebScrapingService {
  private readonly logger = new Logger(WebScrapingService.name);

  // Función para decodificar entidades HTML
  private decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&#225;': 'á',
      '&#233;': 'é',
      '&#237;': 'í',
      '&#243;': 'ó',
      '&#250;': 'ú',
      '&#241;': 'ñ',
      '&#193;': 'Á',
      '&#201;': 'É',
      '&#205;': 'Í',
      '&#211;': 'Ó',
      '&#218;': 'Ú',
      '&#209;': 'Ñ',
      '&#252;': 'ü',
      '&#220;': 'Ü',
      '&#174;': '®',
      '&#8482;': '™',
      '&quot;': '"',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&nbsp;': ' ',
      '&#39;': "'",
      '&aacute;': 'á',
      '&eacute;': 'é',
      '&iacute;': 'í',
      '&oacute;': 'ó',
      '&uacute;': 'ú',
      '&ntilde;': 'ñ',
      '&Aacute;': 'Á',
      '&Eacute;': 'É',
      '&Iacute;': 'Í',
      '&Oacute;': 'Ó',
      '&Uacute;': 'Ú',
      '&Ntilde;': 'Ñ',
      '&uuml;': 'ü',
      '&Uuml;': 'Ü',
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }
    return decoded;
  }

  constructor(private prisma: PrismaService) {}

  async syncWebScrapingData() {
    this.logger.log('Starting web scraping data sync...');

    try {
      const targetUrls = [
        'https://www.nationalsoft.store/Producto/CatalogoHardware',
      ];

      for (const url of targetUrls) {
        await this.scrapeAndSaveNationalSoft(url);
      }

      this.logger.log('Web scraping sync completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error syncing web scraping data: ${errorMessage}`);
      await this.logSync('web_scraping', 'error', undefined, 0, errorMessage);
      throw error;
    }
  }

  private async scrapeAndSaveNationalSoft(url: string) {
    this.logger.log(`Scraping NationalSoft: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 30000
      });

      if (!response.data) {
        throw new Error('No HTML response received');
      }

      const html = response.data;
      this.logger.log(`📄 HTML obtenido, longitud: ${html.length}`);

      const productos: any[] = [];
      
      // Estrategia 1: Dividir por contenedor principal
      const productBlocks = html.split(/<div class="col-md-4 col-sm-6">/);
      this.logger.log(`🔍 Encontrados ${productBlocks.length - 1} bloques de productos`);

      for (let i = 1; i < productBlocks.length; i++) {
        const block = productBlocks[i];
        
        try {
          let nombre = '';
          const nombreMatch = block.match(/<h4[^>]*class="[^"]*productName[^"]*"[^>]*>([^<]+)<\/h4>/);
          if (nombreMatch) {
            nombre = nombreMatch[1].trim();
            nombre = this.decodeHtmlEntities(nombre);
            nombre = nombre.replace(/\s+/g, ' ');
          }

          if (!nombre || nombre.length < 3) continue;

          let precioFinal = '';
          const priceBlock = block.match(/<h4[^>]*class="[^"]*productPrice[^"]*"[^>]*>([\s\S]*?)<\/h4>/);
          if (priceBlock) {
            const priceContent = priceBlock[1];
            const priceMatch = priceContent.match(/<span[^>]*class="[^"]*text-regular[^"]*"[^>]*>Precio:<\/span>\s*([^<]+)/);
            if (priceMatch) {
              precioFinal = priceMatch[1].trim().replace(/\s+/g, ' ');
            } else {
              const directPriceMatch = priceContent.match(/\$\s*([\d,]+\.\d{2})/);
              if (directPriceMatch) {
                precioFinal = `$${directPriceMatch[1]}`;
              }
            }
          }

          if (!precioFinal) {
            const priceInBlock = block.match(/\$\s*([\d,]+\.\d{2})/);
            if (priceInBlock) {
              precioFinal = `$${priceInBlock[1]}`;
            }
          }

          let imagen = '';
          const imgMatch = block.match(/<img[^>]+src="([^"]+)"[^>]*>/);
          if (imgMatch) {
            imagen = imgMatch[1];
            if (imagen && !imagen.startsWith('http')) {
              imagen = `https://www.nationalsoft.store${imagen}`;
            }
          }

          let productUrl = '';
          const urlMatch = block.match(/<a[^>]+href="(\/Producto\/VerDetalle\/[^"]+)"[^>]*>/);
          if (urlMatch) {
            productUrl = urlMatch[1];
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.nationalsoft.store${productUrl}`;
            }
          }

          let categoria = 'Hardware';
          const nombreLower = nombre.toLowerCase();
          if (nombreLower.includes('software') || nombreLower.includes('licencia')) categoria = 'Software';
          else if (nombreLower.includes('terminal') || nombreLower.includes('pos')) categoria = 'Terminal PDV';
          else if (nombreLower.includes('impresora') || nombreLower.includes('printer')) categoria = 'Impresión';
          else if (nombreLower.includes('monitor')) categoria = 'Monitores';
          else if (nombreLower.includes('gaveta') || nombreLower.includes('cajón') || nombreLower.includes('lector')) categoria = 'Accesorios PDV';

          productos.push({
            nombre,
            precio: precioFinal || 'Precio no disponible',
            imagen: imagen || 'https://placehold.co/300x300/cccccc/666666?text=Producto',
            url: productUrl || '#',
            categoria,
            descripcion: 'Producto profesional para punto de venta.'
          });

        } catch (e) {
          this.logger.error(`Error procesando bloque: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Estrategia 2: Buscar por widget
      if (productos.length === 0) {
        this.logger.log('⚠️ No se encontraron productos con estrategia 1, usando estrategia 2...');
        
        const widgetBlocks = html.split(/<div class="widget bg-gray-dark contentProduct-HW">/);
        this.logger.log(`🔍 Encontrados ${widgetBlocks.length - 1} widgets`);
        
        for (let i = 1; i < widgetBlocks.length; i++) {
          const block = widgetBlocks[i];
          
          try {
            let nombre = '';
            const nombreMatch = block.match(/<h4[^>]*class="[^"]*productName[^"]*"[^>]*>([^<]+)<\/h4>/);
            if (nombreMatch) {
              nombre = nombreMatch[1].trim();
              nombre = this.decodeHtmlEntities(nombre);
              nombre = nombre.replace(/\s+/g, ' ');
            }
            
            if (!nombre || nombre.length < 3) continue;
            
            let precioFinal = '';
            const priceMatch = block.match(/<h4[^>]*class="[^"]*productPrice[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*text-regular[^"]*"[^>]*>Precio:<\/span>\s*([^<]+)/);
            if (priceMatch) {
              precioFinal = priceMatch[1].trim().replace(/\s+/g, ' ');
            } else {
              const simplePrice = block.match(/\$\s*([\d,]+\.\d{2})/);
              if (simplePrice) {
                precioFinal = `$${simplePrice[1]}`;
              }
            }
            
            let imagen = '';
            const imgMatch = block.match(/<img[^>]+src="([^"]+)"[^>]*>/);
            if (imgMatch) {
              imagen = imgMatch[1];
              if (imagen && !imagen.startsWith('http')) {
                imagen = `https://www.nationalsoft.store${imagen}`;
              }
            }
            
            let productUrl = '';
            const urlMatch = block.match(/<a[^>]+href="(\/Producto\/VerDetalle\/[^"]+)"[^>]*>/);
            if (urlMatch) {
              productUrl = urlMatch[1];
              if (productUrl && !productUrl.startsWith('http')) {
                productUrl = `https://www.nationalsoft.store${productUrl}`;
              }
            }
            
            productos.push({
              nombre,
              precio: precioFinal || 'Precio no disponible',
              imagen: imagen || 'https://placehold.co/300x300/cccccc/666666?text=Producto',
              url: productUrl || '#',
              categoria: 'Hardware',
              descripcion: 'Producto profesional para punto de venta.'
            });
          } catch (e) {
            this.logger.error(`Error procesando widget: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }
      }

      // Eliminar duplicados
      const productosUnicos = productos.filter((p, index, self) => 
        index === self.findIndex((t) => t.nombre === p.nombre || t.url === p.url)
      );

      this.logger.log(`✅ Scraping completado: ${productosUnicos.length} productos`);

      const scrapedData = {
        title: 'Productos NationalSoft - Hardware',
        content: `${productosUnicos.length} productos extraídos de NationalSoft`,
        metadata: {
          total: productosUnicos.length,
          source: url,
          scrapedAt: new Date().toISOString(),
          categories: [...new Set(productosUnicos.map(p => p.categoria))]
        },
        data: productosUnicos.slice(0, 30)
      };

      const dataHash = this.generateDataHash(scrapedData);

      const existingData = await this.prisma.webScrapingData.findUnique({
        where: { sourceUrl: url }
      });

      if (existingData && existingData.hash === dataHash) {
        this.logger.log(`No changes detected for ${url}`);
        await this.logSync('web_scraping', 'no_changes', dataHash, 0);
        return;
      }

      const result = await this.prisma.webScrapingData.upsert({
        where: { sourceUrl: url },
        update: {
          title: scrapedData.title,
          content: scrapedData.content,
          metadata: scrapedData.metadata,
          data: scrapedData.data,
          hash: dataHash,
          updatedAt: new Date(),
        },
        create: {
          sourceUrl: url,
          title: scrapedData.title,
          content: scrapedData.content,
          metadata: scrapedData.metadata,
          data: scrapedData.data,
          hash: dataHash,
        },
      });

      this.logger.log(`Web scraping data synced successfully for ${url}: ${scrapedData.data.length} products`);
      await this.logSync('web_scraping', 'success', dataHash, scrapedData.data.length);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error scraping ${url}: ${errorMessage}`);
      throw error;
    }
  }

  private generateDataHash(data: any): string {
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  private async logSync(source: string, status: string, dataHash?: string, recordsCount?: number, errorMessage?: string) {
    try {
      await this.prisma.syncLog.create({
        data: {
          source,
          status,
          dataHash: dataHash || null,
          recordsCount: recordsCount || 0,
          errorMessage: errorMessage || null,
        },
      });
    } catch (error) {
      this.logger.error(`Error logging sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWebScrapingData(url?: string) {
    if (url) {
      return this.prisma.webScrapingData.findUnique({
        where: { sourceUrl: url }
      });
    }
    return this.prisma.webScrapingData.findMany();
  }

  // Método para probar el scraper sin guardar - SOLO UNA VEZ
  async scrapeProductsDirectly(url: string = 'https://www.nationalsoft.store/Producto/CatalogoHardware') {
    this.logger.log(`Testing scraper for: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 30000
      });

      if (!response.data) {
        throw new Error('No HTML response received');
      }

      const html = response.data;
      this.logger.log(`📄 HTML obtenido, longitud: ${html.length}`);

      const productos: any[] = [];
      
      // Estrategia 1: Dividir por contenedor principal
      const productBlocks = html.split(/<div class="col-md-4 col-sm-6">/);
      this.logger.log(`🔍 Encontrados ${productBlocks.length - 1} bloques de productos`);

      for (let i = 1; i < productBlocks.length; i++) {
        const block = productBlocks[i];
        
        try {
          let nombre = '';
          const nombreMatch = block.match(/<h4[^>]*class="[^"]*productName[^"]*"[^>]*>([^<]+)<\/h4>/);
          if (nombreMatch) {
            nombre = nombreMatch[1].trim();
            nombre = this.decodeHtmlEntities(nombre);
            nombre = nombre.replace(/\s+/g, ' ');
          }

          if (!nombre || nombre.length < 3) continue;

          let precioFinal = '';
          const priceBlock = block.match(/<h4[^>]*class="[^"]*productPrice[^"]*"[^>]*>([\s\S]*?)<\/h4>/);
          if (priceBlock) {
            const priceContent = priceBlock[1];
            const priceMatch = priceContent.match(/<span[^>]*class="[^"]*text-regular[^"]*"[^>]*>Precio:<\/span>\s*([^<]+)/);
            if (priceMatch) {
              precioFinal = priceMatch[1].trim().replace(/\s+/g, ' ');
            } else {
              const directPriceMatch = priceContent.match(/\$\s*([\d,]+\.\d{2})/);
              if (directPriceMatch) {
                precioFinal = `$${directPriceMatch[1]}`;
              }
            }
          }

          if (!precioFinal) {
            const priceInBlock = block.match(/\$\s*([\d,]+\.\d{2})/);
            if (priceInBlock) {
              precioFinal = `$${priceInBlock[1]}`;
            }
          }

          let imagen = '';
          const imgMatch = block.match(/<img[^>]+src="([^"]+)"[^>]*>/);
          if (imgMatch) {
            imagen = imgMatch[1];
            if (imagen && !imagen.startsWith('http')) {
              imagen = `https://www.nationalsoft.store${imagen}`;
            }
          }

          let productUrl = '';
          const urlMatch = block.match(/<a[^>]+href="(\/Producto\/VerDetalle\/[^"]+)"[^>]*>/);
          if (urlMatch) {
            productUrl = urlMatch[1];
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.nationalsoft.store${productUrl}`;
            }
          }

          let categoria = 'Hardware';
          const nombreLower = nombre.toLowerCase();
          if (nombreLower.includes('software') || nombreLower.includes('licencia')) categoria = 'Software';
          else if (nombreLower.includes('terminal') || nombreLower.includes('pos')) categoria = 'Terminal PDV';
          else if (nombreLower.includes('impresora') || nombreLower.includes('printer')) categoria = 'Impresión';
          else if (nombreLower.includes('monitor')) categoria = 'Monitores';
          else if (nombreLower.includes('gaveta') || nombreLower.includes('cajón') || nombreLower.includes('lector')) categoria = 'Accesorios PDV';

          productos.push({
            nombre,
            precio: precioFinal || 'Precio no disponible',
            imagen: imagen || 'https://placehold.co/300x300/cccccc/666666?text=Producto',
            url: productUrl || '#',
            categoria,
            descripcion: 'Producto profesional para punto de venta.'
          });

        } catch (e) {
          this.logger.error(`Error procesando bloque: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Estrategia 2: Buscar por widget
      if (productos.length === 0) {
        this.logger.log('⚠️ No se encontraron productos con estrategia 1, usando estrategia 2...');
        
        const widgetBlocks = html.split(/<div class="widget bg-gray-dark contentProduct-HW">/);
        this.logger.log(`🔍 Encontrados ${widgetBlocks.length - 1} widgets`);
        
        for (let i = 1; i < widgetBlocks.length; i++) {
          const block = widgetBlocks[i];
          
          try {
            let nombre = '';
            const nombreMatch = block.match(/<h4[^>]*class="[^"]*productName[^"]*"[^>]*>([^<]+)<\/h4>/);
            if (nombreMatch) {
              nombre = nombreMatch[1].trim();
              nombre = this.decodeHtmlEntities(nombre);
              nombre = nombre.replace(/\s+/g, ' ');
            }
            
            if (!nombre || nombre.length < 3) continue;
            
            let precioFinal = '';
            const priceMatch = block.match(/<h4[^>]*class="[^"]*productPrice[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*text-regular[^"]*"[^>]*>Precio:<\/span>\s*([^<]+)/);
            if (priceMatch) {
              precioFinal = priceMatch[1].trim().replace(/\s+/g, ' ');
            } else {
              const simplePrice = block.match(/\$\s*([\d,]+\.\d{2})/);
              if (simplePrice) {
                precioFinal = `$${simplePrice[1]}`;
              }
            }
            
            let imagen = '';
            const imgMatch = block.match(/<img[^>]+src="([^"]+)"[^>]*>/);
            if (imgMatch) {
              imagen = imgMatch[1];
              if (imagen && !imagen.startsWith('http')) {
                imagen = `https://www.nationalsoft.store${imagen}`;
              }
            }
            
            let productUrl = '';
            const urlMatch = block.match(/<a[^>]+href="(\/Producto\/VerDetalle\/[^"]+)"[^>]*>/);
            if (urlMatch) {
              productUrl = urlMatch[1];
              if (productUrl && !productUrl.startsWith('http')) {
                productUrl = `https://www.nationalsoft.store${productUrl}`;
              }
            }
            
            productos.push({
              nombre,
              precio: precioFinal || 'Precio no disponible',
              imagen: imagen || 'https://placehold.co/300x300/cccccc/666666?text=Producto',
              url: productUrl || '#',
              categoria: 'Hardware',
              descripcion: 'Producto profesional para punto de venta.'
            });
          } catch (e) {
            this.logger.error(`Error procesando widget: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }
      }

      // Eliminar duplicados
      const productosUnicos = productos.filter((p, index, self) => 
        index === self.findIndex((t) => t.nombre === p.nombre || t.url === p.url)
      );

      this.logger.log(`✅ Scraping completado: ${productosUnicos.length} productos`);

      return {
        success: true,
        total: productosUnicos.length,
        productos: productosUnicos.slice(0, 30)
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error en scrapeProductsDirectly: ${errorMessage}`);
      throw error;
    }
  }
}