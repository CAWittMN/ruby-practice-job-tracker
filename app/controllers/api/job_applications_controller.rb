module Api
  class JobApplicationsController < BaseController
    before_action :set_job_application, only: %i[show update destroy]

    def index
      applications = current_user.job_applications
                                 .includes(:contacts, :todos, :communications)
                                 .order(Arel.sql("applied_on DESC NULLS LAST"), created_at: :desc)
      render json: applications.map { |app| serialize(app) }
    end

    def show
      render json: serialize(@job_application)
    end

    def create
      application = current_user.job_applications.new(job_application_params)

      if application.save
        render json: serialize(application), status: :created
      else
        render json: { errors: application.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @job_application.update(job_application_params)
        render json: serialize(@job_application)
      else
        render json: { errors: @job_application.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @job_application.destroy
      head :no_content
    end

    private

    def set_job_application
      @job_application = current_user.job_applications.find(params[:id])
    end

    def job_application_params
      params.require(:job_application).permit(
        :job_title, :company_name, :applied_on, :status, :cover_letter_provided,
        :linkedin_messages_provided, :company_website, :job_posting_url, :source,
        contacts_attributes: %i[id name role linkedin_url _destroy],
        todos_attributes: %i[id title completed due_on _destroy]
      )
    end

    def serialize(application)
      {
        id: application.id,
        job_title: application.job_title,
        company_name: application.company_name,
        applied_on: application.applied_on,
        status: application.status,
        cover_letter_provided: application.cover_letter_provided,
        linkedin_messages_provided: application.linkedin_messages_provided,
        company_website: application.company_website,
        job_posting_url: application.job_posting_url,
        source: application.source,
        created_at: application.created_at,
        contacts: application.contacts.map do |contact|
          { id: contact.id, name: contact.name, role: contact.role, linkedin_url: contact.linkedin_url }
        end,
        todos: application.todos.sort_by { |t| [t.completed ? 1 : 0, t.created_at] }.map do |todo|
          { id: todo.id, title: todo.title, completed: todo.completed, due_on: todo.due_on }
        end,
        communications: application.communications.sort_by { |c| [c.occurred_on || Date.new(0), c.created_at] }.reverse.map do |comm|
          {
            id: comm.id,
            contact_id: comm.contact_id,
            occurred_on: comm.occurred_on,
            channel: comm.channel,
            note: comm.note
          }
        end
      }
    end
  end
end
