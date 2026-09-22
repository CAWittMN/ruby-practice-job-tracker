module Api
  class ContactsController < BaseController
    before_action :set_job_application
    before_action :set_contact, only: %i[update destroy]

    def create
      contact = @job_application.contacts.new(contact_params)

      if contact.save
        render json: serialize(contact), status: :created
      else
        render json: { errors: contact.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @contact.update(contact_params)
        render json: serialize(@contact)
      else
        render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @contact.destroy
      head :no_content
    end

    private

    def set_job_application
      @job_application = current_user.job_applications.find(params[:job_application_id])
    end

    def set_contact
      @contact = @job_application.contacts.find(params[:id])
    end

    def contact_params
      params.require(:contact).permit(:name, :role, :email, :linkedin_url)
    end

    def serialize(contact)
      { id: contact.id, name: contact.name, role: contact.role, email: contact.email, linkedin_url: contact.linkedin_url }
    end
  end
end
