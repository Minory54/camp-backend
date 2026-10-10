#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1c728052d96802086884d9a51cfc1e83bd5f6a03c861fd97913e5d792c223eb2/contract.d.ts';
import startContract from '../../snapshots/1c728052d96802086884d9a51cfc1e83bd5f6a03c861fd97913e5d792c223eb2/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b9eff4df235dda12af0f98eedf7392b657f60ec73017d265ab3dfb1e8f560353/contract.d.ts';
import endContract from '../../snapshots/b9eff4df235dda12af0f98eedf7392b657f60ec73017d265ab3dfb1e8f560353/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'test_answers',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_question', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_student', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_correct', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'test_answers',
        constraint: 'test_answers_student_question_key',
        columns: ['id_student', 'id_question'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'test_answers',
        index: 'test_answers_id_student_idx_d8b13a38',
        columns: ['id_student'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'test_answers',
        index: 'test_answers_question_idx_c008a217',
        columns: ['id_question'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'test_answers',
        foreignKey: {
          name: 'test_answers_id_student_fkey',
          columns: ['id_student'],
          references: { schema: 'public', table: 'students', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'test_answers',
        foreignKey: {
          name: 'test_answers_id_question_fkey',
          columns: ['id_question'],
          references: { schema: 'public', table: 'test_questions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
