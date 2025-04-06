import {
  BeforeUpdate,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  public createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  public updatedAt: Date | null;

  // Обновление поля updatedAt только при изменении сущности
  @BeforeUpdate()
  updateTimestamps() {
    this.updatedAt = new Date(); // Обновляем updatedAt вручную
  }
}
