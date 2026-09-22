module Api
  class TodosController < BaseController
    before_action :set_job_application
    before_action :set_todo, only: %i[update destroy]

    def create
      todo = @job_application.todos.new(todo_params)

      if todo.save
        render json: serialize(todo), status: :created
      else
        render json: { errors: todo.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @todo.update(todo_params)
        render json: serialize(@todo)
      else
        render json: { errors: @todo.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @todo.destroy
      head :no_content
    end

    private

    def set_job_application
      @job_application = current_user.job_applications.find(params[:job_application_id])
    end

    def set_todo
      @todo = @job_application.todos.find(params[:id])
    end

    def todo_params
      params.require(:todo).permit(:title, :completed, :due_on)
    end

    def serialize(todo)
      {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        due_on: todo.due_on,
        created_at: todo.created_at
      }
    end
  end
end
