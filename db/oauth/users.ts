import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { createId } from "@paralleldrive/cuid2"

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
})
