import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { BadRequestDomainException } from '../exceptions/domain-exceptions';

@Injectable()
export class NumberIdValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): string {
    // Проверяем, что это строковый параметр
    if (metadata.metatype !== String) {
      return value;
    }

    // Проверяем, что значение — положительное целое число
    if (!/^\d+$/.test(value)) {
      throw BadRequestDomainException.create(`Invalid numeric ID: ${value}`);
    }
    // Оставляем ID в формате строки
    return value;
  }
}
