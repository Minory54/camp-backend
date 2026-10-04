#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5760c01d8e756309015d9a1a17a3bcd870a08d220a176dd83848ef2831df3ef8/contract';
import endContract from '../../snapshots/5760c01d8e756309015d9a1a17a3bcd870a08d220a176dd83848ef2831df3ef8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'code_languages',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'courses',
        columns: [
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'groups',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_course', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('state', 'text', {
            notNull: true,
            default: lit('open'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('groups_positive_position_a1898ac2', 'position >= 1'),
          checkExpression(
            'groups_state_check_979be375',
            "\"state\" IN ('open', 'locked', 'hidden')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'lesson_progress',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_lesson', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_student', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('practice_completed_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('test_completed_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('theory_completed_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'lessons',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_group', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_practice', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id_test', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id_theory', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('is_hidden', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'lessons_materials_required_ac5b09aa',
            'num_nonnulls(id_theory, id_practice, id_test) >= 1',
          ),
          checkExpression('lessons_positive_position_a1898ac2', 'position >= 1'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'practice_files',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('filename', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_code_language', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_practice', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'practice_saves',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_practice', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_student', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'practices',
        columns: [
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('mdx_source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('test_js', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'question_options',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_question', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('is_correct', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('options_positive_position_a1898ac2', 'position >= 1'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'save_files',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_practice_file', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_practice_save', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'student_sessions',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expires_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_student', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('token_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('sessions_valid_expiry_5a5e9d22', 'expires_at > created_at'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'students',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('display_code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('label', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recovery_code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'technologies',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'test_questions',
        columns: [
          col('code_block', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_code_language', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id_test', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('single'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('questions_positive_position_a1898ac2', 'position >= 1'),
          checkExpression(
            'test_questions_type_check_811a06af',
            "\"type\" IN ('single', 'multiple')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'tests',
        columns: [
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'theories',
        columns: [
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_technology', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('mdx_source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('theories_positive_position_a1898ac2', 'position >= 1'),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'code_languages',
        constraint: 'code_languages_title_key',
        columns: ['title'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'courses',
        constraint: 'courses_title_key',
        columns: ['title'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'groups',
        constraint: 'groups_id_course_position_key',
        columns: ['id_course', 'position'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lesson_progress',
        constraint: 'lesson_progress_student_lesson_key',
        columns: ['id_student', 'id_lesson'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lessons',
        constraint: 'lessons_group_position_key',
        columns: ['id_group', 'position'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'practice_files',
        constraint: 'practice_files_practice_filename_key',
        columns: ['id_practice', 'filename'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'practice_saves',
        constraint: 'practice_saves_student_practice_key',
        columns: ['id_student', 'id_practice'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'question_options',
        constraint: 'question_options_position_key',
        columns: ['id_question', 'position'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'save_files',
        constraint: 'save_files_save_practice_file_key',
        columns: ['id_practice_save', 'id_practice_file'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'student_sessions',
        constraint: 'student_sessions_token_hash_key',
        columns: ['token_hash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'students',
        constraint: 'students_display_code_key',
        columns: ['display_code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'students',
        constraint: 'students_recovery_code_key',
        columns: ['recovery_code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'technologies',
        constraint: 'technologies_title_key',
        columns: ['title'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'test_questions',
        constraint: 'test_questions_position_key',
        columns: ['id_test', 'position'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'theories',
        constraint: 'theories_technology_position_key',
        columns: ['id_technology', 'position'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'groups',
        index: 'groups_id_course_idx_5da05881',
        columns: ['id_course'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson_progress',
        index: 'lesson_progress_id_student_idx_d8b13a38',
        columns: ['id_student'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson_progress',
        index: 'lesson_progress_lesson_idx_989bae98',
        columns: ['id_lesson'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessons',
        index: 'lessons_id_group_idx_c44609ee',
        columns: ['id_group'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessons',
        index: 'lessons_id_practice_idx_14cc6014',
        columns: ['id_practice'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessons',
        index: 'lessons_id_test_idx_87fc3af7',
        columns: ['id_test'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessons',
        index: 'lessons_id_theory_idx_0cf4e88a',
        columns: ['id_theory'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'practice_files',
        index: 'practice_files_id_code_language_idx_036c04b7',
        columns: ['id_code_language'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'practice_files',
        index: 'practice_files_id_practice_idx_14cc6014',
        columns: ['id_practice'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'practice_saves',
        index: 'practice_saves_id_student_idx_d8b13a38',
        columns: ['id_student'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'practice_saves',
        index: 'practice_saves_practice_idx_14cc6014',
        columns: ['id_practice'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'question_options',
        index: 'question_options_id_question_idx_c008a217',
        columns: ['id_question'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'save_files',
        index: 'save_files_id_practice_file_idx_f2278f13',
        columns: ['id_practice_file'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'save_files',
        index: 'save_files_id_practice_save_idx_4d1d5c98',
        columns: ['id_practice_save'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'student_sessions',
        index: 'sessions_student_idx_d8b13a38',
        columns: ['id_student'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'test_questions',
        index: 'test_questions_id_code_language_idx_036c04b7',
        columns: ['id_code_language'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'test_questions',
        index: 'test_questions_id_test_idx_87fc3af7',
        columns: ['id_test'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'theories',
        index: 'theories_id_technology_idx_571d30e4',
        columns: ['id_technology'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'groups',
        foreignKey: {
          name: 'groups_id_course_fkey',
          columns: ['id_course'],
          references: { schema: 'public', table: 'courses', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson_progress',
        foreignKey: {
          name: 'lesson_progress_id_student_fkey',
          columns: ['id_student'],
          references: { schema: 'public', table: 'students', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson_progress',
        foreignKey: {
          name: 'lesson_progress_id_lesson_fkey',
          columns: ['id_lesson'],
          references: { schema: 'public', table: 'lessons', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessons',
        foreignKey: {
          name: 'lessons_id_group_fkey',
          columns: ['id_group'],
          references: { schema: 'public', table: 'groups', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessons',
        foreignKey: {
          name: 'lessons_id_theory_fkey',
          columns: ['id_theory'],
          references: { schema: 'public', table: 'theories', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessons',
        foreignKey: {
          name: 'lessons_id_test_fkey',
          columns: ['id_test'],
          references: { schema: 'public', table: 'tests', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessons',
        foreignKey: {
          name: 'lessons_id_practice_fkey',
          columns: ['id_practice'],
          references: { schema: 'public', table: 'practices', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'practice_files',
        foreignKey: {
          name: 'practice_files_id_practice_fkey',
          columns: ['id_practice'],
          references: { schema: 'public', table: 'practices', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'practice_files',
        foreignKey: {
          name: 'practice_files_id_code_language_fkey',
          columns: ['id_code_language'],
          references: { schema: 'public', table: 'code_languages', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'practice_saves',
        foreignKey: {
          name: 'practice_saves_id_student_fkey',
          columns: ['id_student'],
          references: { schema: 'public', table: 'students', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'practice_saves',
        foreignKey: {
          name: 'practice_saves_id_practice_fkey',
          columns: ['id_practice'],
          references: { schema: 'public', table: 'practices', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'question_options',
        foreignKey: {
          name: 'question_options_id_question_fkey',
          columns: ['id_question'],
          references: { schema: 'public', table: 'test_questions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'save_files',
        foreignKey: {
          name: 'save_files_id_practice_file_fkey',
          columns: ['id_practice_file'],
          references: { schema: 'public', table: 'practice_files', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'save_files',
        foreignKey: {
          name: 'save_files_id_practice_save_fkey',
          columns: ['id_practice_save'],
          references: { schema: 'public', table: 'practice_saves', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'student_sessions',
        foreignKey: {
          name: 'student_sessions_id_student_fkey',
          columns: ['id_student'],
          references: { schema: 'public', table: 'students', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'test_questions',
        foreignKey: {
          name: 'test_questions_id_test_fkey',
          columns: ['id_test'],
          references: { schema: 'public', table: 'tests', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'test_questions',
        foreignKey: {
          name: 'test_questions_id_code_language_fkey',
          columns: ['id_code_language'],
          references: { schema: 'public', table: 'code_languages', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'theories',
        foreignKey: {
          name: 'theories_id_technology_fkey',
          columns: ['id_technology'],
          references: { schema: 'public', table: 'technologies', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
