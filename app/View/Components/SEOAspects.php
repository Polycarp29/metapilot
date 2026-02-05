<?php

namespace App\View\Components;

use Closure;
use Illuminate\View\Component;
use Illuminate\Contracts\View\View;
use App\Models\Admin\Settings\SEOConfigurations;

class SEOAspects extends Component
{
    /**
     * Create a new component instance.
     */
    public function __construct()
    {
        //
    }



   

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('components.s-e-o-aspects');
    }
}
