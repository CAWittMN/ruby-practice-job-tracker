namespace :emails do
  desc "Poll the configured IMAP mailbox once and ingest new messages"
  task poll: :environment do
    poller = ImapPoller.new
    unless poller.configured?
      warn "IMAP is not configured. Set IMAP_HOST, IMAP_USERNAME and IMAP_PASSWORD."
      exit 1
    end

    results = poller.poll
    matched = results.count { |r| r.status == "matched" }
    puts "Ingested #{results.size} email(s): #{matched} matched, #{results.size - matched} pending review."
  end

  desc "Continuously poll the IMAP mailbox every INTERVAL seconds (default 120)"
  task poll_loop: :environment do
    interval = Integer(ENV.fetch("INTERVAL", 120))
    poller = ImapPoller.new
    unless poller.configured?
      warn "IMAP is not configured. Set IMAP_HOST, IMAP_USERNAME and IMAP_PASSWORD."
      exit 1
    end

    puts "Polling every #{interval}s. Ctrl-C to stop."
    loop do
      begin
        results = poller.poll
        puts "[#{Time.current.iso8601}] ingested #{results.size} email(s)." unless results.empty?
      rescue StandardError => e
        warn "[#{Time.current.iso8601}] poll error: #{e.class}: #{e.message}"
      end
      sleep interval
    end
  end
end
