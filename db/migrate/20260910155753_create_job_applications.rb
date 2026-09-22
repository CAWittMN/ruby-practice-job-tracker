class CreateJobApplications < ActiveRecord::Migration[7.2]
  def change
    create_table :job_applications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :job_title
      t.string :company_name
      t.date :applied_on
      t.boolean :cover_letter_provided, null: false, default: false
      t.boolean :linkedin_messages_provided, null: false, default: false
      t.string :company_website
      t.string :job_posting_url
      t.string :source

      t.timestamps
    end
  end
end
