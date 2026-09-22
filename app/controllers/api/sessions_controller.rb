module Api
  class SessionsController < BaseController
    skip_before_action :require_authentication, only: %i[create show]

    def show
      if signed_in?
        render json: { id: current_user.id, email: current_user.email }
      else
        render json: nil
      end
    end

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase)

      if user&.authenticate(params[:password])
        reset_session
        session[:user_id] = user.id
        render json: { id: user.id, email: user.email }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def destroy
      reset_session
      head :no_content
    end
  end
end
