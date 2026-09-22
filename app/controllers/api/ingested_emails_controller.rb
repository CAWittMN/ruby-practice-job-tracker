module Api
  class IngestedEmailsController < BaseController
    before_action :set_email, only: %i[assign ignore create_application destroy]

    def index
      emails = current_user.ingested_emails.pending
      render json: emails.map { |email| serialize(email) }
    end

    # Attach the email to an existing job application as a logged communication.
    def assign
      job = current_user.job_applications.find(params[:job_application_id])
      contact = job.contacts.find_by(id: params[:contact_id]) if params[:contact_id].present?

      communication = job.communications.new(
        contact: contact,
        occurred_on: (@email.received_at || Time.current).to_date,
        channel: "Email",
        note: note_for(@email)
      )

      if communication.save
        @email.update!(status: "matched", job_application: job, communication: communication)
        render json: serialize(@email)
      else
        render json: { errors: communication.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # Create a brand new application from the email's detected fields.
    def create_application
      job = current_user.job_applications.new(
        job_title: @email.detected_title.presence || @email.subject.to_s.truncate(120).presence || "Untitled role",
        company_name: @email.detected_company.presence || @email.from_name.presence || sender_domain(@email) || "Unknown company",
        status: "applied",
        applied_on: (@email.received_at || Time.current).to_date,
        source: @email.detected_source
      )

      unless job.save
        return render json: { errors: job.errors.full_messages }, status: :unprocessable_entity
      end

      communication = job.communications.create!(
        occurred_on: (@email.received_at || Time.current).to_date,
        channel: "Email",
        note: note_for(@email)
      )
      @email.update!(status: "matched", job_application: job, communication: communication)
      render json: serialize(@email)
    end

    def ignore
      @email.update!(status: "ignored")
      head :no_content
    end

    def destroy
      @email.destroy
      head :no_content
    end

    private

    def set_email
      @email = current_user.ingested_emails.find(params[:id])
    end

    def sender_domain(email)
      email.from_address.to_s.split("@").last.to_s.downcase.presence
    end

    def note_for(email)
      [email.subject, email.body.to_s.strip.truncate(1000)].reject(&:blank?).join("\n\n")
    end

    def serialize(email)
      {
        id: email.id,
        from_address: email.from_address,
        from_name: email.from_name,
        subject: email.subject,
        snippet: email.snippet,
        received_at: email.received_at,
        kind: email.kind,
        status: email.status,
        detected_company: email.detected_company,
        detected_title: email.detected_title,
        detected_source: email.detected_source
      }
    end
  end
end
