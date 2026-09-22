class CreateIngestedEmails < ActiveRecord::Migration[7.2]
  def change
    create_table :ingested_emails do |t|
      t.references :user, null: true, foreign_key: true
      t.references :job_application, null: true, foreign_key: true
      t.references :communication, null: true, foreign_key: true
      t.string :message_id
      t.string :from_address
      t.string :from_name
      t.string :subject
      t.text :body
      t.datetime :received_at
      t.string :status, null: false, default: "unmatched"
      t.string :kind
      t.string :detected_company
      t.string :detected_title
      t.string :detected_source

      t.timestamps
    end

    add_index :ingested_emails, :message_id, unique: true
    add_index :ingested_emails, :status
  end
end
