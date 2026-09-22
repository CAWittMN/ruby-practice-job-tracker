require "test_helper"

class EmailParserTest < ActiveSupport::TestCase
  def parse(raw)
    EmailParser.new(Mail.read_from_string(raw)).parse
  end

  test "detects an application confirmation and extracts title and company" do
    raw = <<~EMAIL
      From: Woods Bagot Careers <careers@woodsbagot.com>
      To: me@example.com
      Subject: You applied to Senior Architect at Woods Bagot
      Date: Mon, 21 Sep 2026 10:00:00 +0000
      Message-ID: <abc123@woodsbagot.com>
      Content-Type: text/plain

      Thanks for applying. We received your application.
    EMAIL

    result = parse(raw)

    assert_equal "application", result.kind
    assert_equal "Senior Architect", result.detected_title
    assert_equal "Woods Bagot", result.detected_company
    assert_equal "careers@woodsbagot.com", result.from_address
    assert_equal "Woods Bagot Careers", result.from_name
  end

  test "detects a reply" do
    raw = <<~EMAIL
      From: Jane Recruiter <jane@acme.com>
      To: me@example.com
      Subject: Re: Following up on the role
      Message-ID: <reply1@acme.com>
      Content-Type: text/plain

      Great chatting today!
    EMAIL

    result = parse(raw)

    assert_equal "reply", result.kind
    assert_equal "Great chatting today!", result.body.strip
  end

  test "detects source from the sender domain" do
    raw = <<~EMAIL
      From: Indeed Apply <no-reply@indeed.com>
      To: me@example.com
      Subject: Indeed Application: Data Engineer
      Message-ID: <indeed1@indeed.com>
      Content-Type: text/plain

      Your application was submitted.
    EMAIL

    result = parse(raw)

    assert_equal "indeed", result.detected_source
    assert_equal "application", result.kind
  end

  test "extracts text from a multipart message" do
    raw = <<~EMAIL
      From: Someone <someone@example.com>
      To: me@example.com
      Subject: Hello
      Message-ID: <mp1@example.com>
      Content-Type: multipart/alternative; boundary="b"

      --b
      Content-Type: text/plain

      Plain body here.
      --b
      Content-Type: text/html

      <p>HTML body here.</p>
      --b--
    EMAIL

    result = parse(raw)

    assert_equal "Plain body here.", result.body.strip
  end
end
