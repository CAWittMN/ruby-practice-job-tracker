class AddUidTrackingToEmailSettings < ActiveRecord::Migration[7.2]
  def change
    add_column :email_settings, :last_uid, :integer
    add_column :email_settings, :uid_validity, :integer
  end
end
