module Api
  class BaseController < ApplicationController
    before_action :require_authentication

    rescue_from ActiveRecord::RecordNotFound do
      render json: { error: "Not found" }, status: :not_found
    end

    private

    def require_authentication
      return if signed_in?

      render json: { error: "Not authenticated" }, status: :unauthorized
    end
  end
end
