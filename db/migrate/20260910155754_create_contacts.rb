class CreateContacts < ActiveRecord::Migration[7.2]
  def change
    create_table :contacts do |t|
      t.references :job_application, null: false, foreign_key: true
      t.string :name
      t.string :linkedin_url

      t.timestamps
    end
  end
end
