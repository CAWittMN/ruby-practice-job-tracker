namespace :emails do
  desc "Poll every user's configured IMAP mailbox once and ingest new messages"
  task poll: :environment do
    users = User.joins(:email_setting).where(email_settings: { enabled: true })
    if users.none?
      warn "No users have email ingestion enabled. Configure it in Settings."
      next
    end

    users.find_each do |user|
      poller = ImapPoller.new(user: user)
      next unless poller.configured?

      results = poller.poll
      matched = results.count { |r| r.status == "matched" }
      puts "#{user.email}: ingested #{results.size} (#{matched} matched, #{results.size - matched} pending)."
    rescue StandardError => e
      warn "#{user.email}: poll error: #{e.class}: #{e.message}"
    end
  end

  desc "Continuously poll enabled mailboxes every INTERVAL seconds (default 120)"
  task poll_loop: :environment do
    interval = Integer(ENV.fetch("INTERVAL", 120))
    puts "Polling every #{interval}s. Ctrl-C to stop."
    loop do
      Rake::Task["emails:poll"].execute
      sleep interval
    end
  end
end
