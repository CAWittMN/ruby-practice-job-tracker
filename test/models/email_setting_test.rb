require "test_helper"

class EmailSettingTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email: "settings@example.com", password: "password123")
  end

  test "encrypts the imap password at rest but decrypts in the model" do
    setting = @user.create_email_setting!(
      enabled: false, imap_host: "imap.example.com",
      imap_username: "me@example.com", imap_password: "topsecret"
    )

    raw = ActiveRecord::Base.connection.select_value(
      "SELECT imap_password FROM email_settings WHERE id = #{setting.id}"
    )

    assert_not_equal "topsecret", raw
    assert_equal "topsecret", setting.reload.imap_password
  end

  test "is not ready until enabled with host, username and password" do
    setting = @user.build_email_setting(imap_host: "imap.example.com", imap_username: "me@example.com", imap_password: "x")
    assert_not setting.ready?, "disabled setting should not be ready"

    setting.enabled = true
    assert setting.ready?
  end

  test "requires host, username and password when enabled" do
    setting = @user.build_email_setting(enabled: true)
    assert_not setting.valid?
    assert_includes setting.errors.attribute_names, :imap_host
    assert_includes setting.errors.attribute_names, :imap_username
    assert_includes setting.errors.attribute_names, :imap_password
  end

  test "defaults mailbox to INBOX" do
    setting = @user.build_email_setting
    assert_equal "INBOX", setting.mailbox
  end
end
