Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/*
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  namespace :api, defaults: { format: :json } do
    post "signup", to: "registrations#create"
    post "login", to: "sessions#create"
    delete "logout", to: "sessions#destroy"
    get "me", to: "sessions#show"

    resources :job_applications, except: %i[new edit] do
      resources :todos, only: %i[create update destroy]
      resources :contacts, only: %i[create update destroy]
      resources :communications, only: %i[create update destroy]
    end

    resources :ingested_emails, only: %i[index destroy] do
      member do
        patch :assign
        patch :ignore
        post :create_application
      end
    end
  end

  # SPA catch-all: let React Router handle client-side routes.
  # Excludes API, health, and asset paths.
  root "spa#index"
  get "*path", to: "spa#index", constraints: ->(req) { !req.path.start_with?("/api", "/vite", "/rails", "/assets") }
end
