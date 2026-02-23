import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import {
  taskTypeEnum,
  taskStatusEnum,
  taskPriorityEnum,
  responseTypeEnum,
} from "./enums.js";
import { tenants, brands } from "./brand.js";

const tz = { withTimezone: true, mode: "date" as const };

// R3: Task Store — tasks, task_responses

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    type: taskTypeEnum("type").notNull(),
    status: taskStatusEnum("status").notNull().default("open"),
    priority: taskPriorityEnum("priority").notNull().default("normal"),
    context: jsonb("context").default({}),
    workflowId: text("workflow_id"),
    workflowSignal: text("workflow_signal"),
    assignedTo: uuid("assigned_to"),
    humanResponseWindow: text("human_response_window"),
    dueAt: timestamp("due_at", tz),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_task_queue").on(
      table.tenantId,
      table.status,
      table.priority,
      table.createdAt,
    ),
  ],
);

export const taskResponses = pgTable(
  "task_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    responseType: responseTypeEnum("response_type").notNull(),
    responseData: jsonb("response_data").notNull(),
    respondedBy: uuid("responded_by"),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_task_response_latest").on(table.taskId, table.createdAt),
  ],
);
