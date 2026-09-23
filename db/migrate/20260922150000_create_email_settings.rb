class CreateEmailSettings < ActiveRecord::Migration[7.2]
  def change
    create_table :email_settings do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, null: false, default: false
      t.string :imap_host
      t.integer :imap_port, null: false, default: 993
      t.boolean :imap_ssl, null: false, default: true
      t.string :imap_username
      t.text :imap_password
      t.string :imap_mailbox, null: false, default: "INBOX"
      t.datetime :last_polled_at

      t.timestamps
    end
  end
end
