/*
 jQuery Form Validation for Bootstrap
 Author notghettolenny
 Version: 1.2.1
 */

"use strict";

/**
 * Form Validation Class Constructor
 * @param form
 * @param options
 * @constructor
 */
function Validation(form, options) {
    this.form = $(form);
    this.options = options;
    this.regex = {
        email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/m,
        date: /^(([0-9]{4}(-[0-9]{1,2}){2})|(([0-9]{1,2}(\s|\.)){2}[0-9]{4}))$/m,
        min: /^minLength:\d*$/m,
        max: /^maxLength:\d*$/m,
        re: /^regex:(.*)$/m,
        re_replace: /^regex:/m
    };

    // check if form is found in DOM
    /*
    if (this.form.length === 0) {
        console.warn('Element could not be find in DOM.');
        return;
    }
    */

    // check if options are in valid format
    if (typeof this.options !== "object") {
        console.warn('Options have to be a valid json object!');
        return;
    }

    var _this = this;
    // on form submit
    this.form.on('submit', function (e) {
        e.preventDefault();
        // validate form
        _this.validate();
        _this.validate_on_change();
    });

    // on form reset
    this.form.on('reset', function (e) {
        e.preventDefault();
        // reset form
        _this.reset();
    });

    // on valid form
    this.form.on('is-valid', function (e) {
        // remove error message
        _this.removeErrorMessage();
        // check submit option; default: true
        if (typeof _this.options.submitOnValid === "undefined" || _this.options.submitOnValid === true) {
            // submit form
            _this.form[0].submit();
        }
    });

    // on invalid form
    this.form.on('is-invalid', function (e) {
        // check show error message; default: true
        if (typeof _this.options.showErrorMessage === "undefined" || _this.options.showErrorMessage === true) {
            // show error message
            _this.showErrorMessage();
        }
    });
}

/**
 * Validate Form
 */
Validation.prototype.validate = function () {
    // form status (valid or invalid)
    var has_errors = false;
    // for each field in options
    for (var i = 0; i < this.options.fields.length; i++) {
        var field = this.options.fields[i];
        var _this = this;
        // get all form form-group classes
        this.form.find('.form-group').each(function () {
            var group = $(this);
            // get input or select
            var input = $(this).find('input, select');
            // check if input is disabled
            if (typeof input.attr("disabled") !== "undefined" && input.attr("disabled") !== false) {
                // skip this field
                return true;
            }
            // check if inout is valid
            if (input.length !== 0) {
                // compare input name and field name
                if (input.attr('name') === field.name) {
                    // check input for error
                    _this.check(input, field.rule, function (error) {
                        if (error === true) {
                            // form has error
                            has_errors = true;
                            // show error
                            _this.showError(group);
                            // check if field options has prompt message
                            if (typeof field.rule.prompt !== "undefined") {
                                // display prompt message
                                _this.showPrompt(group, field.rule.prompt);
                            }
                        } else {
                            // remove error from field
                            _this.removeError(group);
                            // remove prompt message
                            _this.removePrompt(group);
                            // check if field options showSuccess is undefined or false
                            if (field.rule.showSuccess !== "undefined" && field.rule.showSuccess !== false) {
                                // default: show success status
                                _this.showSuccess(group);
                            }
                        }
                    });
                }
            }
        });
    }
    // check if form has error
    if (has_errors === true) {
        // trigger 'is-invalid' on form
        this.form.trigger('is-invalid');
    } else { // field is valid
        // trigger 'is-valid' on form
        this.form.trigger('is-valid');
    }
};

/**
 * Validate form field on change
 */
Validation.prototype.validate_on_change = function () {
    var _this = this;
    this.form.find('.form-group').each(function () {
        var group = $(this);
        // get input or select
        var input = $(this).find('input, select');
        // check if input is disabled
        if (typeof input.attr("disabled") !== "undefined" && input.attr("disabled") !== false) {
            // skip this field
            return true;
        }
        input.on('change input', function () {
            for (var i = 0; i < _this.options.fields.length; i++) {
                var field = _this.options.fields[i];
                if (field.name === input.attr('name')) {
                    _this.check(input, field.rule, function (error) {
                        if (error === true) {
                            // show error
                            _this.showError(group);
                            // check if field options has prompt message
                            if (typeof field.rule.prompt !== "undefined") {
                                // display prompt message
                                _this.showPrompt(group, field.rule.prompt);
                            }
                        } else {
                            // remove error from field
                            _this.removeError(group);
                            // remove prompt message
                            _this.removePrompt(group);
                            // check if field options showSuccess is undefined or false
                            if (field.rule.showSuccess !== "undefined" && field.rule.showSuccess !== false) {
                                // default: show success status
                                _this.showSuccess(group);
                            }
                        }
                    });
                }
            }
        });
    });
};

/**
 * Check field if rule applies
 * @param input
 * @param rule
 * @param _callback
 */
Validation.prototype.check = function (input, rule, _callback) {
    var error = false;
    if (input.attr("type") === "checkbox" || input.attr("type") === "radio") {
        // check if field rule type is checked
        if (rule.type === "checked") {
            // get all input fields
            var input_fields = document.getElementsByName(input.attr('name'));
            // set error to true
            error = true;
            // for each input field
            for (var _i = 0; _i < input_fields.length; _i++) {
                // check if at least one field for name is checked
                if (input_fields[_i].checked === true) {
                    error = false;
                }
            }
        }
    } else { // input is no checkbox or radio
        // trim input value
        var val = input.val().trim();
        // on field rule type: required
        if (rule.type === "required") {
            // check if value is empty string
            if (val.length === 0) {
                // field is invalid
                error = true;
            }
        } else if (rule.type === "email") { // on field rule type: email
            // check email regex for valid email format
            if (!this.regex.email.test(val)) {
                // field is invalid
                error = true;
            }
        } else if (rule.type === "date") {
            var date_format_1 = new Date(val);
            var data_format_2 = Date.parse(val.replace('.', ' '));
            // check if date has "invalid date" format or does not match date regex
            if (!this.regex.date.test(val) || isNaN(date_format_1.getTime()) || isNaN(data_format_2)) {
                error = true;
            }
        } else if (this.regex.min.test(rule.type)) { // on field rule type: minLength
            // get string length after "minLength:"
            var l = parseInt(rule.type.replace('minLength:', ''));
            // check if value is shorter than passed length
            if (val.length < l) {
                // field is invalid
                error = true;
            }
        } else if (this.regex.max.test(rule.type)) { // on field rule type: maxLength
            // get string length after "maxLength:"
            var l = parseInt(rule.type.replace('maxLength:', ''));
            // check if value is longer than passed length or empty
            if (val.length > l || val.length === 0) {
                // field is invalid
                error = true;
            }
        } else if (this.regex.re.test(rule.type)) { // on field rule type: regex
            // get regex after "regex:"
            var sub_str = rule.type.replace(this.regex.re_replace, '');
            var re = new RegExp(sub_str, "g");
            // check if field matches passed regex
            if (!re.test(val)) {
                // field is valid
                error = true;
            }
        }
    }
    return _callback(error);
};

/**
 * Reset Form
 */
Validation.prototype.reset = function () {
    var _this = this;
    // for each form-group in form
    this.form.find('.form-group').each(function () {
        var group = $(this);
        var input = $(this).find('input, select');
        if (input.length !== 0) {
            // clear input values
            input.val('');
            input.prop('checked', false);
            // remove error, success and prompt
            _this.removeError(group);
            _this.removeSuccess(group);
            _this.removePrompt(group);
            _this.removeErrorMessage();
        }
    });
};

// show error on form-group
Validation.prototype.showError = function (field) {
    field.removeClass(typeof this.options.errorGroupClass !== "undefined" ? this.options.errorGroupClass : 'has-success');
    field.addClass(typeof this.options.errorGroupClass !== "undefined" ? this.options.errorGroupClass : 'has-error');
};

// remove error from form-group
Validation.prototype.removeError = function (field) {
    field.removeClass(typeof this.options.errorGroupClass !== "undefined" ? this.options.errorGroupClass : 'has-error');
    // remove validation help-block from field
    field.find('div.help-block[data-validation]').remove();
};

// show success on form-group
Validation.prototype.showSuccess = function (field) {
    field.removeClass(typeof this.options.errorGroupClass !== "undefined" ? this.options.successGroupClass : 'has-error');
    field.addClass(typeof this.options.successGroupClass !== "undefined" ? this.options.successGroupClass : 'has-success');
};

// remove success from form-group
Validation.prototype.removeSuccess = function (field) {
    field.removeClass(typeof this.options.successGroupClass !== "undefined" ? this.options.successGroupClass : 'has-success');
};

// append prompt message to form-group
Validation.prototype.showPrompt = function (field, prompt) {
    // search for help-block
    var block = field.find('div.help-block');
    // create validation prompt
    var helper = '<div class="help-block" data-validation>' + prompt + '</div>';
    if (block.length === 0) {
        // add help-block to field
        field.append(helper);
    } else {
        // hide default help-block
        block.hide();
        // add validation help-block to field
        field.append(helper);
    }
};

// remove prompt message from form-group
Validation.prototype.removePrompt = function (field) {
    // remove validation help-block
    field.find('div.help-block[data-validation]').remove();
    // show default help-block
    field.find('div.help-block').show();
};

// show error message in alert box
Validation.prototype.showErrorMessage = function () {
    var message = "";
    // check if errorMessageText is undefined
    if (typeof this.options.errorMessageText === "undefined") {
        // display default text
        message = "Please check the fields below.";
    } else {
        // add custom text
        message = this.options.errorMessageText;
    }
    // create alert-box
    var alert = '<div class="alert alert-danger" id="validationErrorMsg">' +
        '<p>' + message + '</p>' +
        '</div>';
    // place alert box on top of form
    if (this.form.find('#validationErrorMsg').length === 0) {
        this.form.prepend(alert);
    }
};

// remove error message
Validation.prototype.removeErrorMessage = function () {
    // remove
    $('#validationErrorMsg').remove();
};
