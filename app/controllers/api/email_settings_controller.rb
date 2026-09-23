module Api
  class EmailSettingsController < BaseController
    def show
      render json: serialize(setting)
    end

    def update
      s = setting
      s.assign_attributes(setting_params)
      # Don't wipe the stored password when the field is left blank on save.
      s.imap_password = s.imap_password_was if params.dig(:email_setting, :imap_password).blank?

      if s.save
        render json: serialize(s)
      else
        render json: { errors: s.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # Verify the stored credentials by logging in.
    def test
      poller = ImapPoller.new(user: current_user)
      poller.test_connection
      render json: { ok: true }
    rescue ImapPoller::NotConfiguredError => e
      render json: { ok: false, error: e.message }, status: :unprocessable_entity
    rescue StandardError => e
      render json: { ok: false, error: "#{e.class}: #{e.message}" }, status: :unprocessable_entity
    end

    # Run one poll cycle now and report what was ingested.
    def poll
      poller = ImapPoller.new(user: current_user)
      results = poller.poll
      matched = results.count { |r| r.status == "matched" }
      render json: { ingested: results.size, matched: matched, pending: results.size - matched }
    rescue ImapPoller::NotConfiguredError => e
      render json: { error: e.message }, status: :unprocessable_entity
    rescue StandardError => e
      render json: { error: "#{e.class}: #{e.message}" }, status: :unprocessable_entity
    end

    private

    def setting
      @setting ||= current_user.email_setting || current_user.build_email_setting
    end

    def setting_params
      params.require(:email_setting).permit(
        :enabled, :imap_host, :imap_port, :imap_ssl, :imap_username, :imap_password, :imap_mailbox
      )
    end

    def serialize(s)
      {
        enabled: s.enabled,
        imap_host: s.imap_host,
        imap_port: s.imap_port,
        imap_ssl: s.imap_ssl,
        imap_username: s.imap_username,
        imap_mailbox: s.mailbox,
        has_password: s.imap_password.present?,
        ready: s.ready?,
        last_polled_at: s.last_polled_at
      }
    end
  end
end
