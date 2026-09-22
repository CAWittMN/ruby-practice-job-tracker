# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_09_22_140001) do
  create_table "communications", force: :cascade do |t|
    t.integer "job_application_id", null: false
    t.integer "contact_id"
    t.date "occurred_on"
    t.string "channel"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["contact_id"], name: "index_communications_on_contact_id"
    t.index ["job_application_id"], name: "index_communications_on_job_application_id"
  end

  create_table "contacts", force: :cascade do |t|
    t.integer "job_application_id", null: false
    t.string "name"
    t.string "linkedin_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "role"
    t.string "email"
    t.index ["job_application_id"], name: "index_contacts_on_job_application_id"
  end

  create_table "ingested_emails", force: :cascade do |t|
    t.integer "user_id"
    t.integer "job_application_id"
    t.integer "communication_id"
    t.string "message_id"
    t.string "from_address"
    t.string "from_name"
    t.string "subject"
    t.text "body"
    t.datetime "received_at"
    t.string "status", default: "unmatched", null: false
    t.string "kind"
    t.string "detected_company"
    t.string "detected_title"
    t.string "detected_source"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["communication_id"], name: "index_ingested_emails_on_communication_id"
    t.index ["job_application_id"], name: "index_ingested_emails_on_job_application_id"
    t.index ["message_id"], name: "index_ingested_emails_on_message_id", unique: true
    t.index ["status"], name: "index_ingested_emails_on_status"
    t.index ["user_id"], name: "index_ingested_emails_on_user_id"
  end

  create_table "job_applications", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "job_title"
    t.string "company_name"
    t.date "applied_on"
    t.boolean "cover_letter_provided", default: false, null: false
    t.boolean "linkedin_messages_provided", default: false, null: false
    t.string "company_website"
    t.string "job_posting_url"
    t.string "source"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "interested", null: false
    t.index ["user_id"], name: "index_job_applications_on_user_id"
  end

  create_table "todos", force: :cascade do |t|
    t.integer "job_application_id", null: false
    t.string "title", null: false
    t.boolean "completed", default: false, null: false
    t.date "due_on"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id"], name: "index_todos_on_job_application_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "communications", "contacts"
  add_foreign_key "communications", "job_applications"
  add_foreign_key "contacts", "job_applications"
  add_foreign_key "ingested_emails", "communications"
  add_foreign_key "ingested_emails", "job_applications"
  add_foreign_key "ingested_emails", "users"
  add_foreign_key "job_applications", "users"
  add_foreign_key "todos", "job_applications"
end
