class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  helper_method :current_user, :signed_in?

  # Keep the SPA's CSRF token fresh: the session (and its token) is rotated on
  # login/logout via reset_session, which would otherwise invalidate the token
  # embedded in the initial page load.
  after_action :expose_csrf_token

  private

  def expose_csrf_token
    response.set_header("X-CSRF-Token", form_authenticity_token) if protect_against_forgery?
  end

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = User.find_by(id: session[:user_id])
  end

  def signed_in?
    current_user.present?
  end
end
