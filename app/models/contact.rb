class Contact < ApplicationRecord
  belongs_to :job_application
  has_many :communications, dependent: :nullify

  validates :name, presence: true
end
