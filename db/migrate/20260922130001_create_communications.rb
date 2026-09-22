class CreateCommunications < ActiveRecord::Migration[7.2]
  def change
    create_table :communications do |t|
      t.references :job_application, null: false, foreign_key: true
      t.references :contact, null: true, foreign_key: true
      t.date :occurred_on
      t.string :channel
      t.text :note

      t.timestamps
    end
  end
end
