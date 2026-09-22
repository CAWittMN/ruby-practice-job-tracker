class Todo < ApplicationRecord
  belongs_to :job_application

  validates :title, presence: true
end
