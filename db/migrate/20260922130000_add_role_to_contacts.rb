class AddRoleToContacts < ActiveRecord::Migration[7.2]
  def change
    add_column :contacts, :role, :string
  end
end
