module Api
  class RegistrationsController < BaseController
    skip_before_action :require_authentication

    def create
      user = User.new(user_params)

      if user.save
        reset_session
        session[:user_id] = user.id
        render json: user_json(user), status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def user_params
      params.require(:user).permit(:email, :password, :password_confirmation)
    end

    def user_json(user)
      { id: user.id, email: user.email }
    end
  end
end
