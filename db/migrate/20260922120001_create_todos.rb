class CreateTodos < ActiveRecord::Migration[7.2]
  def change
    create_table :todos do |t|
      t.references :job_application, null: false, foreign_key: true
      t.string :title, null: false
      t.boolean :completed, null: false, default: false
      t.date :due_on

      t.timestamps
    end
  end
end
