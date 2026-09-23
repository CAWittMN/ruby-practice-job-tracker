require "mail"

# Normalizes a Mail::Message into the fields we care about and guesses what
# kind of email it is (application confirmation, reply, or other).
class EmailParser
  # Sender domain fragment => source value (mirrors the frontend detectors).
  SOURCE_DOMAINS = {
    "christiantechjobs.io" => "christiantechjobs.io",
    "linkedin.com" => "linkedin",
    "indeed.com" => "indeed",
    "glassdoor.com" => "glassdoor",
    "ziprecruiter.com" => "ziprecruiter",
    "monster.com" => "monster",
    "dice.com" => "dice",
    "wellfound.com" => "wellfound",
    "greenhouse.io" => "greenhouse",
    "lever.co" => "lever",
    "myworkdayjobs.com" => "workday",
    "ashbyhq.com" => "ashby"
  }.freeze

  APPLICATION_SUBJECT = /
    applied\sto | application\s(?:received|submitted|sent) |
    application\b[^.\n]{0,20}\b(?:received|submitted|sent) |
    thanks?\sfor\s(?:applying|your\sapplication) | your\sapplication (?:\swas)? |
    we\sreceived\syour\sapplication | application\sconfirmation
  /xi

  # Marketing / non-job noise. When any of these hit we refuse to auto-create a
  # tracker and drop the email into the ignored pile instead of the triage inbox.
  JUNK_SUBJECT = /
    scholarship | financial\s+aid | tuition | student\s+loans? | \bgrants?\b |
    bootcamp | \benroll(?:ment|\snow)? | webinar | newsletter | \bcourse\b |
    free\s+trial | \b\d{1,3}%\s*off | \bsale\b | discount | promo(?:tion|\s*code)? |
    limited[-\s]time | act\s+now | donate | fundraiser |
    apply\s+for\s+(?:aid|financial|a\s+scholarship|a\s+loan|a\s+grant|funding)
  /xi

  Result = Struct.new(
    :message_id, :from_address, :from_name, :subject, :body, :received_at,
    :kind, :detected_source, :detected_company, :detected_title, :promotional,
    keyword_init: true
  )

  def initialize(mail)
    @mail = mail
  end

  def parse
    title, company = detect_title_and_company
    Result.new(
      message_id: @mail.message_id,
      from_address: from_address,
      from_name: from_name,
      subject: subject,
      body: body,
      received_at: received_at,
      kind: kind,
      detected_source: detected_source,
      detected_company: company,
      detected_title: title,
      promotional: promotional?
    )
  end

  private

  def subject
    normalize(@mail.subject).to_s.strip
  end

  def from_address
    Array(@mail.from).first&.downcase
  end

  def from_name
    header = @mail[:from]
    header.respond_to?(:display_names) ? header.display_names.first : nil
  end

  def received_at
    @mail.date&.to_time || Time.current
  end

  def body
    @body ||= begin
      text = normalize(text_part_body)
      text.presence || strip_html(normalize(html_part_body))
    end
  end

  # Mail hands decoded parts back tagged ASCII-8BIT even when the bytes are
  # valid UTF-8, which later raises Encoding::UndefinedConversionError on regex
  # matching or the DB write. Reinterpret as UTF-8, falling back to Latin-1 for
  # genuinely mislabeled mail so nothing raises.
  def normalize(str)
    return str if str.nil?

    utf8 = str.to_s.dup.force_encoding(Encoding::UTF_8)
    return utf8 if utf8.valid_encoding?

    str.to_s.dup.force_encoding(Encoding::ISO_8859_1)
       .encode(Encoding::UTF_8, invalid: :replace, undef: :replace)
  end

  def text_part_body
    if @mail.multipart?
      @mail.text_part&.decoded
    elsif @mail.mime_type == "text/plain" || @mail.mime_type.nil?
      @mail.body.decoded
    end
  rescue StandardError
    nil
  end

  def html_part_body
    if @mail.multipart?
      @mail.html_part&.decoded
    elsif @mail.mime_type == "text/html"
      @mail.body.decoded
    end
  rescue StandardError
    nil
  end

  def strip_html(html)
    return "" if html.blank?

    html.gsub(/<style.*?<\/style>/mi, " ")
        .gsub(/<script.*?<\/script>/mi, " ")
        .gsub(/<[^>]+>/, " ")
        .gsub(/&nbsp;/i, " ")
        .gsub(/&amp;/i, "&")
        .gsub(/\s+/, " ")
        .strip
  end

  def kind
    return "other" if promotional?
    return "reply" if subject.match?(/\A\s*re:/i)
    return "application" if application_email?

    "other"
  end

  # Bulk marketing or otherwise not-a-job mail. Genuine application receipts and
  # recruiter replies from recognized job sources are exempt.
  def promotional?
    return @promotional unless @promotional.nil?

    @promotional =
      if subject.match?(JUNK_SUBJECT)
        true
      elsif bulk_mailing? && !genuine_job_mail?
        true
      else
        false
      end
  end

  def bulk_mailing?
    @mail["List-Unsubscribe"].present? || @mail["Precedence"].to_s.downcase.include?("bulk")
  end

  def genuine_job_mail?
    return false if detected_source.blank?

    subject.match?(/\A\s*re:/i) ||
      subject.match?(APPLICATION_SUBJECT) ||
      body.to_s.match?(APPLICATION_SUBJECT)
  end

  def application_email?
    return true if subject.match?(APPLICATION_SUBJECT)
    return true if body.to_s.match?(APPLICATION_SUBJECT)
    return true if detected_source && subject.match?(/application/i)

    false
  end

  def detected_source
    domain = from_address.to_s.split("@").last.to_s
    match = SOURCE_DOMAINS.find { |fragment, _| domain.include?(fragment) }
    match&.last
  end

  # Best-effort extraction of "<title> at <company>" style subjects.
  def detect_title_and_company
    s = subject
    patterns = [
      /applied to (.+?) at (.+?)[.!]?\z/i,
      /application (?:to|for) (.+?) (?:at|@) (.+?)[.!]?\z/i,
      /application (?:received|submitted|sent)[:\-\s]+(.+?)\s+(?:at|@|-|–|—)\s+(.+?)[.!]?\z/i
    ]

    patterns.each do |re|
      if (m = s.match(re))
        return [clean(m[1]), clean(m[2])]
      end
    end

    if (m = s.match(/(.+?)\s+(?:at|@)\s+(.+?)[.!]?\z/i))
      return [clean(m[1]), clean(m[2])]
    end

    [nil, nil]
  end

  def clean(value)
    value.to_s.gsub(/\s+/, " ").strip.presence
  end
end
