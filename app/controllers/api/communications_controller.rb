module Api
  class CommunicationsController < BaseController
    before_action :set_job_application
    before_action :set_communication, only: %i[update destroy]

    def create
      communication = @job_application.communications.new(communication_params)

      if communication.save
        render json: serialize(communication), status: :created
      else
        render json: { errors: communication.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @communication.update(communication_params)
        render json: serialize(@communication)
      else
        render json: { errors: @communication.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @communication.destroy
      head :no_content
    end

    private

    def set_job_application
      @job_application = current_user.job_applications.find(params[:job_application_id])
    end

    def set_communication
      @communication = @job_application.communications.find(params[:id])
    end

    def communication_params
      params.require(:communication).permit(:contact_id, :occurred_on, :channel, :note)
    end

    def serialize(communication)
      {
        id: communication.id,
        contact_id: communication.contact_id,
        occurred_on: communication.occurred_on,
        channel: communication.channel,
        note: communication.note,
        created_at: communication.created_at
      }
    end
  end
end
