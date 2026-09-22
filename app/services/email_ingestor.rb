# Takes a parsed email and either logs it against an existing job/contact,
# creates a new application from a confirmation email, or stores it for the
# user to triage manually. All matching is scoped to a single owner (user).
class EmailIngestor
  def initialize(parsed, user: nil)
    @parsed = parsed
    @user = user || User.first
  end

  def call
    existing = IngestedEmail.find_by(message_id: @parsed.message_id) if @parsed.message_id.present?
    return existing if existing

    record = build_record

    ActiveRecord::Base.transaction do
      match!(record)
      record.save!
    end

    record
  end

  private

  def build_record
    IngestedEmail.new(
      user: @user,
      message_id: @parsed.message_id,
      from_address: @parsed.from_address,
      from_name: @parsed.from_name,
      subject: @parsed.subject,
      body: @parsed.body,
      received_at: @parsed.received_at,
      kind: @parsed.kind,
      detected_source: @parsed.detected_source,
      detected_company: @parsed.detected_company,
      detected_title: @parsed.detected_title,
      status: "unmatched"
    )
  end

  def match!(record)
    return unless @user

    if (contact = matching_contact)
      log_communication(record, contact.job_application, contact)
    elsif (job = matching_job_by_domain)
      log_communication(record, job, nil)
    elsif @parsed.kind == "application"
      create_application(record)
    end
  end

  def matching_contact
    address = @parsed.from_address
    return nil if address.blank?

    Contact.joins(:job_application)
           .where(job_applications: { user_id: @user.id })
           .where("lower(contacts.email) = ?", address)
           .first
  end

  def matching_job_by_domain
    domain = sender_domain
    return nil if domain.blank?

    @user.job_applications.where.not(company_website: [nil, ""]).find do |job|
      job_domain = URI.parse(job.company_website).host.to_s.downcase.sub(/\Awww\./, "")
      job_domain.present? && (job_domain == domain || domain.end_with?(".#{job_domain}"))
    rescue URI::InvalidURIError
      false
    end
  end

  def sender_domain
    @parsed.from_address.to_s.split("@").last.to_s.downcase.presence
  end

  def log_communication(record, job, contact)
    comm = job.communications.create!(
      contact: contact,
      occurred_on: @parsed.received_at.to_date,
      channel: "Email",
      note: note_body
    )
    record.assign_attributes(
      status: "matched",
      job_application: job,
      communication: comm,
      kind: record.kind == "application" ? "application" : "reply"
    )
  end

  def create_application(record)
    job = @user.job_applications.create!(
      job_title: @parsed.detected_title.presence || @parsed.subject.to_s.truncate(120).presence || "Untitled role",
      company_name: @parsed.detected_company.presence || @parsed.from_name.presence || sender_domain || "Unknown company",
      status: "applied",
      applied_on: @parsed.received_at.to_date,
      source: @parsed.detected_source
    )
    comm = job.communications.create!(
      occurred_on: @parsed.received_at.to_date,
      channel: "Email",
      note: note_body
    )
    record.assign_attributes(status: "matched", job_application: job, communication: comm)
  end

  def note_body
    [@parsed.subject, @parsed.body.to_s.strip.truncate(1000)].reject(&:blank?).join("\n\n")
  end
end
