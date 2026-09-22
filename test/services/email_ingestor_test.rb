require "test_helper"

class EmailIngestorTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email: "owner@example.com", password: "password123")
  end

  def parsed(overrides = {})
    EmailParser::Result.new({
      message_id: "<#{SecureRandom.hex(6)}@example.com>",
      from_address: "someone@example.com",
      from_name: "Someone",
      subject: "Hello",
      body: "Body text",
      received_at: Time.utc(2026, 9, 21, 10, 0, 0),
      kind: "other",
      detected_source: nil,
      detected_company: nil,
      detected_title: nil
    }.merge(overrides))
  end

  test "logs a reply against a job when the sender matches a contact email" do
    job = @user.job_applications.create!(job_title: "Architect", company_name: "Acme", status: "applied", applied_on: Date.today)
    job.contacts.create!(name: "Jane", role: "Recruiter", email: "jane@acme.com")

    record = EmailIngestor.new(parsed(from_address: "jane@acme.com", subject: "Re: role", kind: "reply"), user: @user).call

    assert_equal "matched", record.status
    assert_equal job, record.job_application
    assert_not_nil record.communication
    assert_equal "Jane", record.communication.contact.name
    assert_equal "Email", record.communication.channel
  end

  test "matches by company website domain when no contact email matches" do
    job = @user.job_applications.create!(
      job_title: "Engineer", company_name: "Acme",
      company_website: "https://acme.com", status: "applied", applied_on: Date.today
    )

    record = EmailIngestor.new(parsed(from_address: "hr@acme.com", subject: "An update"), user: @user).call

    assert_equal "matched", record.status
    assert_equal job, record.job_application
    assert_nil record.communication.contact
  end

  test "creates a new application from an application confirmation email" do
    assert_difference -> { @user.job_applications.count }, 1 do
      record = EmailIngestor.new(
        parsed(
          from_address: "no-reply@indeed.com",
          subject: "You applied to Data Engineer at Globex",
          kind: "application",
          detected_source: "indeed",
          detected_title: "Data Engineer",
          detected_company: "Globex"
        ),
        user: @user
      ).call

      assert_equal "matched", record.status
      assert_equal "Data Engineer", record.job_application.job_title
      assert_equal "Globex", record.job_application.company_name
      assert_equal "applied", record.job_application.status
      assert_equal "indeed", record.job_application.source
    end
  end

  test "stores an unmatched email for manual triage" do
    record = EmailIngestor.new(parsed(from_address: "random@nowhere.test"), user: @user).call

    assert_equal "unmatched", record.status
    assert_nil record.job_application
    assert_nil record.communication
  end

  test "does not ingest the same message twice" do
    p = parsed(from_address: "random@nowhere.test")
    first = EmailIngestor.new(p, user: @user).call

    assert_no_difference -> { IngestedEmail.count } do
      second = EmailIngestor.new(p, user: @user).call
      assert_equal first, second
    end
  end
end
