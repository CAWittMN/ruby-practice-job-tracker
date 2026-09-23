class Communication < ApplicationRecord
  belongs_to :job_application
  belongs_to :contact, optional: true
  has_many :ingested_emails, dependent: :nullify

  validates :note, presence: true
  validate :contact_belongs_to_job_application

  private

  def contact_belongs_to_job_application
    return if contact.nil?
    return if contact.job_application_id == job_application_id

    errors.add(:contact, "must belong to this job application")
  end
end
