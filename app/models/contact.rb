class Contact < ApplicationRecord
  belongs_to :job_application
  has_many :communications, dependent: :nullify

  normalizes :email, with: ->(email) { email.to_s.strip.downcase.presence }

  validates :name, presence: true
end
