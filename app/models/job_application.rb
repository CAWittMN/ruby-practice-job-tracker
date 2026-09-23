class JobApplication < ApplicationRecord
  SOURCES = %w[glassdoor indeed linkedin christiantechjobs.io].freeze
  STATUSES = %w[interested applied].freeze

  belongs_to :user
  has_many :contacts, dependent: :destroy
  has_many :todos, dependent: :destroy
  has_many :communications, dependent: :destroy
  # Keep ingested emails around when a job is deleted; just unlink them.
  has_many :ingested_emails, dependent: :nullify

  accepts_nested_attributes_for :contacts, allow_destroy: true,
    reject_if: ->(attrs) { attrs[:name].blank? && attrs[:linkedin_url].blank? }

  accepts_nested_attributes_for :todos, allow_destroy: true,
    reject_if: ->(attrs) { attrs[:title].blank? }

  validates :job_title, :company_name, presence: true
  validates :status, inclusion: { in: STATUSES }
  # Source and application date only matter once you've actually applied.
  validates :applied_on, presence: true, if: :applied?

  def applied?
    status == "applied"
  end
end
